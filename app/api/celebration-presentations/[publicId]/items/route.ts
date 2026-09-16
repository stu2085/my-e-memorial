import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const BUCKET = "memorial-photos";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function hashesMatch(suppliedHash: string, expectedHash: string) {
  const suppliedBuffer = Buffer.from(suppliedHash, "utf8");
  const expectedBuffer = Buffer.from(expectedHash, "utf8");

  return (
    suppliedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(suppliedBuffer, expectedBuffer)
  );
}

function isValidPublicId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function getAuthorizedPresentation(
  req: NextRequest,
  publicId: string
) {
  if (!isValidPublicId(publicId)) {
    return null;
  }

  const { data: presentation, error } = await supabaseAdmin
    .from("celebration_presentations")
    .select("id, public_id, edit_token_hash, status")
    .eq("public_id", publicId)
    .maybeSingle();

  if (error || !presentation) {
    return null;
  }

  const editToken =
    req.cookies.get(`celebration_edit_${publicId}`)?.value || "";

  if (!editToken || !presentation.edit_token_hash) {
    return null;
  }

  if (
    !hashesMatch(
      hashToken(editToken),
      String(presentation.edit_token_hash)
    )
  ) {
    return null;
  }

  if (
    presentation.status === "converted" ||
    presentation.status === "cancelled" ||
    presentation.status === "expired"
  ) {
    return null;
  }

  return presentation;
}

export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{
      publicId: string;
    }>;
  }
) {
  try {
    const { publicId } = await context.params;

    const presentation = await getAuthorizedPresentation(
      req,
      publicId
    );

    if (!presentation) {
      return NextResponse.json(
        {
          error:
            "Editing access is not available for this presentation.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const storagePath = String(
      body?.storagePath || ""
    ).trim();

    const expectedPrefix =
      `celebration-presentations/${publicId}/photos/`;

    if (
      !storagePath ||
      !storagePath.startsWith(expectedPrefix)
    ) {
      return NextResponse.json(
        {
          error:
            "This photo does not belong to this presentation.",
        },
        { status: 400 }
      );
    }

    const {
      data: publicUrlData,
    } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    const photoUrl = String(
      publicUrlData?.publicUrl || ""
    ).trim();

    if (!photoUrl) {
      return NextResponse.json(
        {
          error:
            "The uploaded photo could not be found.",
        },
        { status: 500 }
      );
    }

    const {
      data: lastItem,
      error: orderError,
    } = await supabaseAdmin
      .from("celebration_presentation_items")
      .select("sort_order")
      .eq(
        "presentation_id",
        presentation.id
      )
      .is("removed_at", null)
      .order(
        "sort_order",
        { ascending: false }
      )
      .limit(1)
      .maybeSingle();

    if (orderError) {
      console.error(
        "CELEBRATION ITEM ORDER ERROR:",
        orderError
      );
    }

    const nextSortOrder =
      Number(lastItem?.sort_order ?? -1) + 1;

    const {
      data: item,
      error: insertError,
    } = await supabaseAdmin
      .from("celebration_presentation_items")
      .insert({
        presentation_id:
          presentation.id,
        item_type: "photo",
        photo_url: photoUrl,
        storage_path: storagePath,
        caption: "",
        attribution: "",
        source: "creator",
        approval_status: "approved",
        sort_order: nextSortOrder,
      })
      .select(`
        id,
        item_type,
        photo_url,
        storage_path,
        caption,
        attribution,
        source,
        approval_status,
        sort_order,
        created_at,
        updated_at
      `)
      .single();

    if (
      insertError ||
      !item
    ) {
      console.error(
        "CREATE CELEBRATION PHOTO ITEM ERROR:",
        insertError
      );

      return NextResponse.json(
        {
          error:
            "The photo could not be added to the presentation.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      item,
    });
  } catch (error) {
    console.error(
      "CREATE CELEBRATION ITEM ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "The photo could not be added to the presentation.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: {
    params: Promise<{
      publicId: string;
    }>;
  }
) {
  try {
    const { publicId } = await context.params;

    const presentation = await getAuthorizedPresentation(
      req,
      publicId
    );

    if (!presentation) {
      return NextResponse.json(
        {
          error:
            "Editing access is not available for this presentation.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const itemId = Number(body?.itemId);

    if (
      !Number.isFinite(itemId) ||
      itemId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Presentation item not found.",
        },
        { status: 400 }
      );
    }

    if (body?.action === "move") {
      const direction =
        body?.direction === "earlier"
          ? "earlier"
          : body?.direction === "later"
            ? "later"
            : "";

      if (!direction) {
        return NextResponse.json(
          {
            error: "Invalid move direction.",
          },
          { status: 400 }
        );
      }

      const {
        data: orderedItems,
        error: loadOrderError,
      } = await supabaseAdmin
        .from("celebration_presentation_items")
        .select("id, sort_order")
        .eq(
          "presentation_id",
          presentation.id
        )
        .eq(
          "approval_status",
          "approved"
        )
        .is("removed_at", null)
        .order("sort_order", {
          ascending: true,
        })
        .order("id", {
          ascending: true,
        });

      if (loadOrderError) {
        console.error(
          "LOAD CELEBRATION ITEM ORDER ERROR:",
          loadOrderError
        );

        return NextResponse.json(
          {
            error:
              "The presentation order could not be loaded.",
          },
          { status: 500 }
        );
      }

      const items = orderedItems || [];
      const currentIndex = items.findIndex(
        (item) => item.id === itemId
      );

      if (currentIndex < 0) {
        return NextResponse.json(
          {
            error: "Presentation item not found.",
          },
          { status: 404 }
        );
      }

      const targetIndex =
        direction === "earlier"
          ? currentIndex - 1
          : currentIndex + 1;

      if (
        targetIndex < 0 ||
        targetIndex >= items.length
      ) {
        return NextResponse.json({
          success: true,
          orderedItemIds: items.map(
            (item) => item.id
          ),
        });
      }

      const currentItem = items[currentIndex];
      const targetItem = items[targetIndex];

      const currentSortOrder = Number(
        currentItem.sort_order ?? currentIndex
      );

      const targetSortOrder = Number(
        targetItem.sort_order ?? targetIndex
      );

      if (currentSortOrder !== targetSortOrder) {
        const [
          currentUpdate,
          targetUpdate,
        ] = await Promise.all([
          supabaseAdmin
            .from("celebration_presentation_items")
            .update({
              sort_order: targetSortOrder,
            })
            .eq("id", currentItem.id)
            .eq(
              "presentation_id",
              presentation.id
            )
            .is("removed_at", null),
          supabaseAdmin
            .from("celebration_presentation_items")
            .update({
              sort_order: currentSortOrder,
            })
            .eq("id", targetItem.id)
            .eq(
              "presentation_id",
              presentation.id
            )
            .is("removed_at", null),
        ]);

        if (
          currentUpdate.error ||
          targetUpdate.error
        ) {
          console.error(
            "MOVE CELEBRATION ITEM ERROR:",
            currentUpdate.error ||
              targetUpdate.error
          );

          return NextResponse.json(
            {
              error:
                "The presentation order could not be saved.",
            },
            { status: 500 }
          );
        }
      } else {
        const reordered = [...items];
        const [moved] = reordered.splice(
          currentIndex,
          1
        );

        reordered.splice(
          targetIndex,
          0,
          moved
        );

        for (
          let index = 0;
          index < reordered.length;
          index += 1
        ) {
          const { error } =
            await supabaseAdmin
              .from(
                "celebration_presentation_items"
              )
              .update({
                sort_order: index,
              })
              .eq(
                "id",
                reordered[index].id
              )
              .eq(
                "presentation_id",
                presentation.id
              )
              .is("removed_at", null);

          if (error) {
            console.error(
              "NORMALIZE CELEBRATION ITEM ORDER ERROR:",
              error
            );

            return NextResponse.json(
              {
                error:
                  "The presentation order could not be saved.",
              },
              { status: 500 }
            );
          }
        }
      }

      const finalItems = [...items];
      const [movedItem] = finalItems.splice(
        currentIndex,
        1
      );

      finalItems.splice(
        targetIndex,
        0,
        movedItem
      );

      return NextResponse.json({
        success: true,
        orderedItemIds: finalItems.map(
          (item) => item.id
        ),
      });
    }

    const caption = String(
      body?.caption || ""
    )
      .trim()
      .slice(0, 35);

    const {
      data: updated,
      error: updateError,
    } = await supabaseAdmin
      .from("celebration_presentation_items")
      .update({
        caption,
      })
      .eq("id", itemId)
      .eq(
        "presentation_id",
        presentation.id
      )
      .is("removed_at", null)
      .select(`
        id,
        caption,
        updated_at
      `)
      .maybeSingle();

    if (
      updateError ||
      !updated
    ) {
      return NextResponse.json(
        {
          error:
            "The caption could not be saved.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      item: updated,
    });
  } catch (error) {
    console.error(
      "UPDATE CELEBRATION ITEM ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "The presentation item could not be updated.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: {
    params: Promise<{
      publicId: string;
    }>;
  }
) {
  try {
    const { publicId } = await context.params;

    const presentation = await getAuthorizedPresentation(
      req,
      publicId
    );

    if (!presentation) {
      return NextResponse.json(
        {
          error:
            "Editing access is not available for this presentation.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const itemId = Number(body?.itemId);

    if (
      !Number.isFinite(itemId) ||
      itemId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Presentation item not found.",
        },
        { status: 400 }
      );
    }

    const {
      data: removed,
      error: removeError,
    } = await supabaseAdmin
      .from("celebration_presentation_items")
      .update({
        removed_at:
          new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq(
        "presentation_id",
        presentation.id
      )
      .is("removed_at", null)
      .select("id")
      .maybeSingle();

    if (
      removeError ||
      !removed
    ) {
      return NextResponse.json(
        {
          error:
            "The presentation item could not be removed.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "REMOVE CELEBRATION ITEM ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "The presentation item could not be removed.",
      },
      { status: 500 }
    );
  }
}

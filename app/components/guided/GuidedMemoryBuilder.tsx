"use client";

import {
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";

import GuidedChapterHeader from "./GuidedChapterHeader";
import GuidedLayout from "./GuidedLayout";
import GuidedNavigation from "./GuidedNavigation";
import MemorialChapterNav from "../memorial-builder/MemorialChapterNav";

import {
  getGuidedChapterDescription,
  getGuidedChapters,
  getGuidedChapterTitle,
  type GuidedChapter,
  type MemorialExperienceType,
} from "./ChapterConfig";

type GuidedMemoryBuilderProps = {
  experienceType: MemorialExperienceType;
  isSaving?: boolean;
  initialChapterId?: string | null;
  isReady?: boolean;
  finalButtonLabel?: string;
  chapterNavTargetId?: string;
  renderChapter: (chapter: GuidedChapter) => ReactNode;
  onSaveAndContinue?: (
    chapter: GuidedChapter
  ) => boolean | void | Promise<boolean | void>;
  onSaveAndExit?: (chapter: GuidedChapter) => void | Promise<void>;
  onSafetySave?: (
    chapter: GuidedChapter
  ) => boolean | void | Promise<boolean | void>;
};

export default function GuidedMemoryBuilder({
  experienceType,
  isSaving = false,
  initialChapterId = null,
  isReady = true,
  finalButtonLabel = "Finish Review",
  chapterNavTargetId,
  renderChapter,
  onSaveAndContinue,
  onSaveAndExit,
  onSafetySave,
}: GuidedMemoryBuilderProps) {
  const chapters = useMemo(
    () => getGuidedChapters(experienceType),
    [experienceType]
  );

  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
const [isChangingChapter, setIsChangingChapter] = useState(false);
const [chapterNavTarget, setChapterNavTarget] =
  useState<HTMLElement | null>(null);

const hasRestoredInitialChapter = useRef(false);

useEffect(() => {
  if (!chapterNavTargetId) {
    setChapterNavTarget(null);
    return;
  }

  setChapterNavTarget(
    document.getElementById(chapterNavTargetId)
  );
}, [chapterNavTargetId]);

useEffect(() => {
  if (hasRestoredInitialChapter.current || !initialChapterId) {
    return;
  }

  const savedChapterIndex = chapters.findIndex(
    (chapter) => chapter.id === initialChapterId
  );

  if (savedChapterIndex >= 0) {
    setCurrentChapterIndex(savedChapterIndex);
    hasRestoredInitialChapter.current = true;
  }
}, [initialChapterId, chapters]);
  const unresolvedInitialChapterIndex =
    !hasRestoredInitialChapter.current && initialChapterId
      ? chapters.findIndex(
          (chapter) => chapter.id === initialChapterId
        )
      : -1;

  const effectiveChapterIndex =
    unresolvedInitialChapterIndex >= 0
      ? unresolvedInitialChapterIndex
      : currentChapterIndex;

  const currentChapter = chapters[effectiveChapterIndex];

  const isFirstChapter = effectiveChapterIndex === 0;
  const isLastChapter =
    effectiveChapterIndex === chapters.length - 1;

  useEffect(() => {
    if (!onSafetySave || !currentChapter) {
      return;
    }

    type BackupSafetySaveStatus =
      | "saved"
      | "not-applicable"
      | "busy"
      | "failed";

    type BackupSafetySaveRequestDetail = {
      reason: "warning" | "pre-expiry";
      handled: boolean;
      respond: (status: BackupSafetySaveStatus) => void;
    };

    const handleBackupSafetySave = (event: Event) => {
      const customEvent =
        event as CustomEvent<BackupSafetySaveRequestDetail>;

      if (!customEvent.detail) {
        return;
      }

      customEvent.detail.handled = true;

      if (isChangingChapter || isSaving) {
        customEvent.detail.respond("busy");
        return;
      }

      void (async () => {
        try {
          setIsChangingChapter(true);

          const saveResult =
            await onSafetySave(currentChapter);

          customEvent.detail.respond(
            saveResult === false
              ? "not-applicable"
              : "saved"
          );
        } catch (error) {
          console.error(
            "BACKUP PERSON SAFETY SAVE ERROR:",
            error
          );
          customEvent.detail.respond("failed");
        } finally {
          setIsChangingChapter(false);
        }
      })();
    };

    window.addEventListener(
      "myememorial-backup-safety-save",
      handleBackupSafetySave
    );

    return () => {
      window.removeEventListener(
        "myememorial-backup-safety-save",
        handleBackupSafetySave
      );
    };
  }, [
    currentChapter,
    isChangingChapter,
    isSaving,
    onSafetySave,
  ]);

  function scrollToTop() {
    setTimeout(() => {
      const chapterTop = document.getElementById(
        "guided-memory-builder-top"
      );

      if (!chapterTop) {
        return;
      }

      const mainNav =
        document.querySelector<HTMLElement>("header.sticky");
      const mainNavHeight =
        mainNav?.getBoundingClientRect().height ?? 0;

      const chapterNav = chapterNavTargetId
        ? document.getElementById(chapterNavTargetId)
        : null;
      const chapterNavHeight =
        chapterNav?.getBoundingClientRect().height ?? 0;

      /*
       * The site navbar and chapter-icon row are both sticky. Position the
       * complete "Chapter X of Y" header just below those two rows, with a
       * small breathing space. The memorial banner is intentionally not part
       * of this calculation, so it scrolls off screen normally.
       */
      const visibleStickyHeight =
        mainNavHeight + chapterNavHeight + 12;
      const targetTop =
        window.scrollY +
        chapterTop.getBoundingClientRect().top -
        visibleStickyHeight;

      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth",
      });
    }, 0);
  }

  function handleBack() {
    if (isFirstChapter || isChangingChapter) {
      return;
    }

    setCurrentChapterIndex((previousIndex) => previousIndex - 1);
    scrollToTop();
  }

  function handleChapterSelect(chapterId: string) {
    if (isChangingChapter || isSaving) {
      return;
    }

    const targetChapterIndex = chapters.findIndex(
      (chapter) => chapter.id === chapterId
    );

    if (targetChapterIndex < 0) {
      return;
    }

    if (targetChapterIndex === effectiveChapterIndex) {
      scrollToTop();
      return;
    }

    setCurrentChapterIndex(targetChapterIndex);
    scrollToTop();
  }

  async function handleContinue() {
    if (!currentChapter || isChangingChapter) {
      return;
    }

    try {
      setIsChangingChapter(true);

      const shouldAdvance = onSaveAndContinue
        ? await onSaveAndContinue(currentChapter)
        : true;

      if (shouldAdvance === false) {
        return;
      }

      if (!isLastChapter) {
        setCurrentChapterIndex(
          (previousIndex) => previousIndex + 1
        );

        scrollToTop();
      }
    } finally {
      setIsChangingChapter(false);
    }
  }

  async function handleSaveAndExit() {
    if (!currentChapter || isChangingChapter) {
      return;
    }

    try {
      setIsChangingChapter(true);

      if (onSaveAndExit) {
        await onSaveAndExit(currentChapter);
        return;
      }

      window.location.assign("/");
    } finally {
      setIsChangingChapter(false);
    }
  }

  if (!isReady || !currentChapter) {
    return null;
  }

  const title = getGuidedChapterTitle(
    currentChapter,
    experienceType
  );

  const description = getGuidedChapterDescription(
    currentChapter,
    experienceType
  );

  const chapterNavigation = (
    <MemorialChapterNav
      chapters={chapters.map((chapter) => ({
        id: chapter.id,
        title: getGuidedChapterTitle(chapter, experienceType),
        disabled: isSaving || isChangingChapter,
      }))}
      currentChapterId={currentChapter.id}
      onChapterSelect={handleChapterSelect}
    />
  );

  return (
    <>
      {chapterNavTargetId
        ? chapterNavTarget
          ? createPortal(chapterNavigation, chapterNavTarget)
          : null
        : chapterNavigation}

      <div id="guided-memory-builder-top">
        <GuidedLayout>
          <GuidedChapterHeader
            chapterNumber={effectiveChapterIndex + 1}
            totalChapters={chapters.length}
            title={title}
            description={description}
          />

          <div id="guided-chapter" className="mt-8">
            {renderChapter(currentChapter)}
          </div>

          <GuidedNavigation
            currentChapterIndex={effectiveChapterIndex}
            totalChapters={chapters.length}
            isFirstChapter={isFirstChapter}
            isLastChapter={isLastChapter}
            isSaving={isSaving || isChangingChapter}
            finalButtonLabel={finalButtonLabel}
            onBack={handleBack}
            onContinue={handleContinue}
            onSaveAndExit={handleSaveAndExit}
          />
        </GuidedLayout>
      </div>
    </>
  );
}
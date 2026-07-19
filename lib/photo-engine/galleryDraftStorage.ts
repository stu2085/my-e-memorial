import {
  createGalleryPhoto,
  type GalleryPhoto,
} from "./GalleryPhoto";

const DATABASE_NAME = "myememorial-drafts";
const DATABASE_VERSION = 1;
const STORE_NAME = "gallery-photos";
const DRAFT_KEY = "current-memorial-gallery";

type StoredGalleryPhoto = {
  id: string;
  file: File;
  fingerprint: string;
  caption: string;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available."));
      return;
    }

    const request = indexedDB.open(
      DATABASE_NAME,
      DATABASE_VERSION
    );

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(
        request.error ??
          new Error("Could not open the draft database.")
      );
    };
  });
}

export async function saveGalleryDraft(
  photos: GalleryPhoto[]
): Promise<void> {
  const database = await openDatabase();

  const storedPhotos: StoredGalleryPhoto[] = photos.map(
    (photo) => ({
      id: photo.id,
      file: photo.file,
      fingerprint: photo.fingerprint,
      caption: photo.caption,
    })
  );

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(
      STORE_NAME,
      "readwrite"
    );

    const store = transaction.objectStore(STORE_NAME);

    store.put(storedPhotos, DRAFT_KEY);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();
      reject(
        transaction.error ??
          new Error("Could not save gallery draft.")
      );
    };

    transaction.onabort = () => {
      database.close();
      reject(
        transaction.error ??
          new Error("Saving gallery draft was interrupted.")
      );
    };
  });
}

export async function loadGalleryDraft(): Promise<
  GalleryPhoto[]
> {
  const database = await openDatabase();

  const storedPhotos = await new Promise<
    StoredGalleryPhoto[] | undefined
  >((resolve, reject) => {
    const transaction = database.transaction(
      STORE_NAME,
      "readonly"
    );

    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(DRAFT_KEY);

    request.onsuccess = () => {
      resolve(
        request.result as StoredGalleryPhoto[] | undefined
      );
    };

    request.onerror = () => {
      reject(
        request.error ??
          new Error("Could not load gallery draft.")
      );
    };

    transaction.oncomplete = () => {
      database.close();
    };
  });

  if (!storedPhotos) {
    return [];
  }

  return storedPhotos.map((storedPhoto) => {
    const photo = createGalleryPhoto(
      storedPhoto.file,
      storedPhoto.fingerprint
    );

    return {
      ...photo,
      id: storedPhoto.id,
      caption: storedPhoto.caption,
    };
  });
}

export async function clearGalleryDraft(): Promise<void> {
  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(
      STORE_NAME,
      "readwrite"
    );

    const store = transaction.objectStore(STORE_NAME);

    store.delete(DRAFT_KEY);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();
      reject(
        transaction.error ??
          new Error("Could not clear gallery draft.")
      );
    };
  });
}
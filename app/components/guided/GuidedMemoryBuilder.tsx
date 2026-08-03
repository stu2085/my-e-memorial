"use client";

import {
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import GuidedChapterHeader from "./GuidedChapterHeader";
import GuidedLayout from "./GuidedLayout";
import GuidedNavigation from "./GuidedNavigation";

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
  renderChapter: (chapter: GuidedChapter) => ReactNode;
  onSaveAndContinue?: (chapter: GuidedChapter) => void | Promise<void>;
  onSaveAndExit?: (chapter: GuidedChapter) => void | Promise<void>;
};

export default function GuidedMemoryBuilder({
  experienceType,
  isSaving = false,
  initialChapterId = null,
  renderChapter,
  onSaveAndContinue,
  onSaveAndExit,
}: GuidedMemoryBuilderProps) {
  const chapters = useMemo(
    () => getGuidedChapters(experienceType),
    [experienceType]
  );

  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [isChangingChapter, setIsChangingChapter] = useState(false);
useEffect(() => {
  if (!initialChapterId) {
    return;
  }

  const savedChapterIndex = chapters.findIndex(
    (chapter) => chapter.id === initialChapterId
  );

  if (savedChapterIndex >= 0) {
    setCurrentChapterIndex(savedChapterIndex);
  }
}, [initialChapterId, chapters]);
  const currentChapter = chapters[currentChapterIndex];

  const isFirstChapter = currentChapterIndex === 0;
  const isLastChapter = currentChapterIndex === chapters.length - 1;

  function scrollToTop() {
  setTimeout(() => {
    document
      .getElementById("guided-chapter")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
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

  async function handleContinue() {
    if (!currentChapter || isChangingChapter) {
      return;
    }

    try {
      setIsChangingChapter(true);

      if (onSaveAndContinue) {
        await onSaveAndContinue(currentChapter);
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

  if (!currentChapter) {
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

  return (
    <GuidedLayout>
      <GuidedChapterHeader
        chapterNumber={currentChapterIndex + 1}
        totalChapters={chapters.length}
        title={title}
        description={description}
      />

      <div id="guided-chapter" className="mt-8 scroll-mt-6">
  {renderChapter(currentChapter)}
</div>

      <GuidedNavigation
        currentChapterIndex={currentChapterIndex}
        totalChapters={chapters.length}
        isFirstChapter={isFirstChapter}
        isLastChapter={isLastChapter}
        isSaving={isSaving || isChangingChapter}
        onBack={handleBack}
        onContinue={handleContinue}
        onSaveAndExit={handleSaveAndExit}
      />
    </GuidedLayout>
  );
}
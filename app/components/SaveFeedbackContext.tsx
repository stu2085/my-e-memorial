"use client";

import { createContext, ReactNode, useContext } from "react";

type SaveFeedbackContextValue = {
  savedSection: string;
  successMessage: string;
};

const SaveFeedbackContext = createContext<SaveFeedbackContextValue>({
  savedSection: "",
  successMessage: "",
});

type SaveFeedbackProviderProps = {
  savedSection: string;
  successMessage: string;
  children: ReactNode;
};

export function SaveFeedbackProvider({
  savedSection,
  successMessage,
  children,
}: SaveFeedbackProviderProps) {
  return (
    <SaveFeedbackContext.Provider
      value={{
        savedSection,
        successMessage,
      }}
    >
      {children}
    </SaveFeedbackContext.Provider>
  );
}

export function useSaveFeedback() {
  return useContext(SaveFeedbackContext);
}
import { margaretHamilton } from "./margaretHamilton";
import type { Story } from "./types";

/** Catálogo de histórias. Para adicionar outra, importe-a e inclua-a nesta lista. */
export const stories: Story[] = [margaretHamilton];

export function getStory(storyId: string): Story | undefined {
  return stories.find((story) => story.id === storyId);
}

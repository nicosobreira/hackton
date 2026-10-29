/** Formato reutilizável para histórias e seus slides. */
export type StoryAction = "next" | "start-game";

export interface StorySlide {
  eyebrow?: string;
  title: string;
  text?: string;
  image?: string;
  imageAlt?: string;
  buttonText?: string;
  action?: StoryAction;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  slides: StorySlide[];
}

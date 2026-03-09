export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  description?: string;
  required: boolean;
  placeholder?: string;
  options?: {
    choices?: string[];
    min?: number;
    max?: number;
    labels?: [string, string];
    step?: number;
  };
}

export type FormFieldType =
  | "short_text"
  | "long_text"
  | "single_choice"
  | "multiple_choice"
  | "rating"
  | "likert"
  | "nps"
  | "date"
  | "email"
  | "number";

export const fieldTypeLabels: Record<FormFieldType, string> = {
  short_text: "Short Text",
  long_text: "Long Text",
  single_choice: "Single Choice",
  multiple_choice: "Multiple Choice",
  rating: "Rating",
  likert: "Likert Scale",
  nps: "NPS (0-10)",
  date: "Date",
  email: "Email",
  number: "Number",
};

export const defaultFormTemplates = {
  post_workshop: {
    title: "Post-Workshop Feedback",
    type: "feedback",
    description: "Collect participant feedback after a workshop session.",
    fields: [
      {
        id: "field_1",
        type: "rating" as FormFieldType,
        label: "How would you rate the session overall?",
        required: true,
        options: { min: 1, max: 5, labels: ["Poor", "Excellent"] as [string, string] },
      },
      {
        id: "field_2",
        type: "rating" as FormFieldType,
        label: "How relevant was the content to your role?",
        required: true,
        options: { min: 1, max: 5, labels: ["Not relevant", "Very relevant"] as [string, string] },
      },
      {
        id: "field_3",
        type: "single_choice" as FormFieldType,
        label: "Would you recommend this to a colleague?",
        required: true,
        options: { choices: ["Definitely", "Probably", "Not sure", "Probably not", "Definitely not"] },
      },
      {
        id: "field_4",
        type: "long_text" as FormFieldType,
        label: "What was the most valuable takeaway?",
        required: false,
      },
      {
        id: "field_5",
        type: "long_text" as FormFieldType,
        label: "What could be improved?",
        required: false,
      },
      {
        id: "field_6",
        type: "rating" as FormFieldType,
        label: "How confident do you feel applying what you've learned?",
        required: true,
        options: { min: 1, max: 5, labels: ["Not confident", "Very confident"] as [string, string] },
      },
    ],
  },
  pre_session: {
    title: "Pre-Session Survey",
    type: "survey",
    description: "Understand participants before a session to tailor content.",
    fields: [
      {
        id: "field_1",
        type: "single_choice" as FormFieldType,
        label: "How familiar are you with neurodiversity?",
        required: true,
        options: { choices: ["Very", "Somewhat", "A little", "Not at all"] },
      },
      {
        id: "field_2",
        type: "multiple_choice" as FormFieldType,
        label: "What do you hope to learn?",
        required: true,
        options: {
          choices: [
            "Understanding neurodiversity",
            "Supporting colleagues",
            "Adjustments & accommodations",
            "Personal development",
            "Other",
          ],
        },
      },
      {
        id: "field_3",
        type: "long_text" as FormFieldType,
        label: "Is there anything specific you'd like covered?",
        required: false,
      },
    ],
  },
  follow_up_90: {
    title: "90-Day Follow-Up (Level 3 Kirkpatrick)",
    type: "assessment",
    description: "Measure long-term behaviour change after training.",
    fields: [
      {
        id: "field_1",
        type: "rating" as FormFieldType,
        label: "Since the session, how much has your understanding of neurodiversity improved?",
        required: true,
        options: { min: 1, max: 5, labels: ["Not at all", "Significantly"] as [string, string] },
      },
      {
        id: "field_2",
        type: "rating" as FormFieldType,
        label: "How often do you apply what you learned in your daily work?",
        required: true,
        options: { min: 1, max: 5, labels: ["Never", "Always"] as [string, string] },
      },
      {
        id: "field_3",
        type: "single_choice" as FormFieldType,
        label: "Have you made any changes to how you work with neurodivergent colleagues?",
        required: true,
        options: { choices: ["Yes, significant", "Yes, minor", "Not yet", "No"] },
      },
      {
        id: "field_4",
        type: "long_text" as FormFieldType,
        label: "Can you describe a specific example of something you've done differently?",
        required: false,
      },
      {
        id: "field_5",
        type: "nps" as FormFieldType,
        label: "How likely are you to recommend neuroinclusion training to others?",
        required: true,
        options: { min: 0, max: 10 },
      },
    ],
  },
};

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type RendererOptions = {
  placeholder?: string;
  required?: boolean;
  options?: string[];
};

type RendererQuestion = {
  id: string;
  question: string;
  answerType: string;
  optionsJson?: RendererOptions | null;
};

function getOptions(question: RendererQuestion) {
  const options = question.optionsJson?.options ?? [];
  return options.length ? options : ["Pilihan A", "Pilihan B", "Pilihan C"];
}

export function DynamicFormRenderer({ questions }: { questions: RendererQuestion[] }) {
  return (
    <div className="grid gap-4">
      {questions.map((question) => (
        <FieldRenderer key={question.id} question={question} />
      ))}
    </div>
  );
}

function FieldRenderer({ question }: { question: RendererQuestion }) {
  const required = question.optionsJson?.required ?? true;
  const placeholder = question.optionsJson?.placeholder ?? "";

  if (question.answerType === "TEXTAREA") {
    return (
      <label className="block text-sm font-medium">
        {question.question}
        <Textarea name={question.id} required={required} placeholder={placeholder} className="mt-1" />
      </label>
    );
  }

  if (question.answerType === "YES_NO") {
    return (
      <fieldset className="grid gap-2 text-sm">
        <legend className="font-medium">{question.question}</legend>
        <div className="flex flex-wrap gap-2">
          {["Ya", "Tidak"].map((option) => (
            <label key={option} className="flex h-9 items-center gap-2 rounded-lg border bg-white px-3">
              <input type="radio" name={question.id} value={option} required={required} />
              {option}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (question.answerType === "MULTIPLE_CHOICE") {
    return (
      <fieldset className="grid gap-2 text-sm">
        <legend className="font-medium">{question.question}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {getOptions(question).map((option) => (
            <label key={option} className="flex min-h-10 items-center gap-2 rounded-lg border bg-white px-3">
              <input type="radio" name={question.id} value={option} required={required} />
              {option}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (question.answerType === "CHECKBOX") {
    return (
      <fieldset className="grid gap-2 text-sm">
        <legend className="font-medium">{question.question}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {getOptions(question).map((option) => (
            <label key={option} className="flex min-h-10 items-center gap-2 rounded-lg border bg-white px-3">
              <input type="checkbox" name={`${question.id}[]`} value={option} />
              {option}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (question.answerType.includes("RATING")) {
    const max = question.answerType === "RATING_1_10" ? 10 : 5;
    return (
      <fieldset className="grid gap-2 text-sm">
        <legend className="font-medium">{question.question}</legend>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: max }).map((_, index) => (
            <label key={index} className="grid h-9 w-9 place-items-center rounded-lg border bg-white">
              <input className="sr-only" type="radio" name={question.id} value={index + 1} required={required} />
              {index + 1}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  return (
    <label className="block text-sm font-medium">
      {question.question}
      <Input
        name={question.id}
        type={question.answerType === "NUMBER" ? "number" : "text"}
        required={required}
        placeholder={placeholder}
        className="mt-1"
      />
    </label>
  );
}

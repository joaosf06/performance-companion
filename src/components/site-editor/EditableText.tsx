import { cn } from "@/lib/utils";

interface EditableTextProps {
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  className?: string;
  multiline?: boolean;
}

const EditableText = ({
  value,
  editing,
  onChange,
  as = "span",
  className,
  multiline = false,
}: EditableTextProps) => {
  const Tag = as as keyof JSX.IntrinsicElements;

  return (
    <Tag
      key={editing ? "edit" : "view"}
      contentEditable={editing}
      suppressContentEditableWarning
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const next = multiline ? e.currentTarget.innerText : e.currentTarget.innerText.replace(/\n/g, " ");
        if (next !== value) onChange(next.trim());
      }}
      className={cn(
        className,
        multiline && "whitespace-pre-wrap",
        editing &&
          "cursor-text rounded outline-dashed outline-1 outline-offset-2 outline-primary/60 focus:outline-primary focus:outline-solid",
      )}
    >
      {value}
    </Tag>
  );
};

export default EditableText;

type Props = { data: string };

/** Renders a JSON-LD <script> for structured data. */
export function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: data }}
    />
  );
}

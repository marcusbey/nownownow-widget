import DOMPurify from "dompurify";
import * as markedLibrary from "marked";
import "../styles/markdown.css";

const { marked } = markedLibrary;

// Initialize marked with options
markedLibrary.marked.setOptions({
  gfm: true,
  breaks: true,
});

const markdownExample = `
# This is a heading 1

## This is a heading 2

This is a paragraph with **bold text** and *italicized text*.

This is a [link to Google](https://www.google.com)

- This is a list item
- Another list item
  - A nested list item

1. This is a numbered list
2. Another numbered item

> This is a blockquote.

\`\`\`
// This is a code block
console.log("Hello world");
\`\`\`

And this is \`inline code\`.

`;

const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "ul",
      "ol",
      "li",
      "a",
      "em",
      "strong",
      "b",
      "i",
      "code",
      "pre",
      "blockquote",
      "span",
      "div",
      "img",
      "br",
    ],
    ALLOWED_ATTR: ["href", "class", "target", "src", "alt", "style"],
  });
};

export const MarkdownTest = () => {
  const htmlContent = marked(markdownExample) as string;

  return (
    <div className="markdown-test-container">
      <h2>Markdown Rendering Test</h2>
      <div className="test-container">
        <div className="markdown-example">
          <h3>Raw Markdown:</h3>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              margin: "1em 0",
              padding: "1em",
              background: "#f5f5f5",
              borderRadius: "4px",
            }}
          >
            {markdownExample}
          </pre>
        </div>
        <div className="rendered-markdown">
          <h3>Rendered Result:</h3>
          <div
            className="markdown-content"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlContent) }}
          />
        </div>
      </div>
    </div>
  );
};

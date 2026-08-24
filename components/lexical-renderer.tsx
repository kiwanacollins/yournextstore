import type { LexicalRichText } from "@/lib/payload";

// Minimal Lexical JSON -> React renderer. Payload's own converter
// (@payloadcms/richtext-lexical) is a heavier dependency than this storefront needs —
// blog posts and legal pages only use paragraphs, headings, lists, links, and basic
// text formatting (bold/italic/underline), all covered below. Extend the switch if an
// editor uses a node type this doesn't handle yet.

type LexicalNode = {
	type: string;
	children?: LexicalNode[];
	text?: string;
	format?: number | string;
	tag?: string;
	url?: string;
	newTab?: boolean;
	listType?: "number" | "bullet";
	[key: string]: unknown;
};

const TEXT_FORMAT = {
	bold: 1,
	italic: 2,
	strikethrough: 4,
	underline: 8,
	code: 16,
} as const;

function renderText(node: LexicalNode, key: number) {
	const format = typeof node.format === "number" ? node.format : 0;
	let content: React.ReactNode = node.text;
	if (format & TEXT_FORMAT.code) content = <code key={key}>{content}</code>;
	if (format & TEXT_FORMAT.bold) content = <strong key={key}>{content}</strong>;
	if (format & TEXT_FORMAT.italic) content = <em key={key}>{content}</em>;
	if (format & TEXT_FORMAT.underline) content = <u key={key}>{content}</u>;
	if (format & TEXT_FORMAT.strikethrough) content = <s key={key}>{content}</s>;
	return <span key={key}>{content}</span>;
}

function renderChildren(children: LexicalNode[] | undefined) {
	return (children ?? []).map((child, i) => renderNode(child, i));
}

function renderNode(node: LexicalNode, key: number): React.ReactNode {
	switch (node.type) {
		case "text":
			return renderText(node, key);
		case "paragraph":
			return <p key={key}>{renderChildren(node.children)}</p>;
		case "heading": {
			const Tag = (node.tag ?? "h2") as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
			return <Tag key={key}>{renderChildren(node.children)}</Tag>;
		}
		case "list": {
			const ListTag = node.listType === "number" ? "ol" : "ul";
			return <ListTag key={key}>{renderChildren(node.children)}</ListTag>;
		}
		case "listitem":
			return <li key={key}>{renderChildren(node.children)}</li>;
		case "quote":
			return <blockquote key={key}>{renderChildren(node.children)}</blockquote>;
		case "link":
			return (
				<a key={key} href={node.url} target={node.newTab ? "_blank" : undefined} rel="noreferrer">
					{renderChildren(node.children)}
				</a>
			);
		case "linebreak":
			return <br key={key} />;
		default:
			return node.children ? <span key={key}>{renderChildren(node.children)}</span> : null;
	}
}

export function LexicalRenderer({ content, className }: { content: LexicalRichText; className?: string }) {
	const rootChildren = (content.root.children ?? []) as LexicalNode[];
	return <div className={className}>{rootChildren.map((node, i) => renderNode(node, i))}</div>;
}

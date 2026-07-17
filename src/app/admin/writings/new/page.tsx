import { ArticleEditor, type ArticleDraft } from "@/components/admin/ArticleEditor";

const empty: ArticleDraft = {
  title: "",
  slug: "",
  contentHtml: "",
  excerpt: "",
  coverImage: "",
  coverCredit: "",
  language: "en",
  translationHtml: "",
  translationLang: "hi",
  tags: [],
  status: "draft",
  featured: false,
  seoTitle: "",
  seoDescription: "",
};

export default function NewArticlePage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold">New writing</h1>
      <ArticleEditor initial={empty} />
    </div>
  );
}

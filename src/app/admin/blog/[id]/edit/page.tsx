import { requireEditor } from "@/lib/auth/admin";
import { getBlogPostForEdit } from "@/lib/actions/admin/blog";
import { notFound } from "next/navigation";
import BlogForm from "@/components/admin/BlogForm";

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireEditor();

  const { id } = await params;
  const post = await getBlogPostForEdit(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-1 text-dark-900">Edit Blog Post</h1>
        <p className="text-body text-dark-700 mt-2">Update blog post information</p>
      </div>

      <BlogForm post={post} />
    </div>
  );
}


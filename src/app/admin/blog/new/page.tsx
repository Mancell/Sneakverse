import { requireEditor } from "@/lib/auth/admin";
import BlogForm from "@/components/admin/BlogForm";

export default async function NewBlogPage() {
  await requireEditor();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-1 text-dark-900">Create New Blog Post</h1>
        <p className="text-body text-dark-700 mt-2">Add a new blog post to your site</p>
      </div>

      <BlogForm />
    </div>
  );
}


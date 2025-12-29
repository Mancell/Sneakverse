import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left side - Image */}
      <div className="hidden lg:block relative bg-dark-900">
        <Image
          src="/auth-bg.jpg"
          alt="Nike"
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-light-100">
            <h1 className="text-heading-1 mb-4">Nike</h1>
            <p className="text-body">Just Do It</p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex items-center justify-center p-8 bg-light-100">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </main>
  );
}


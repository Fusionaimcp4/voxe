import Image from "next/image" // Import the Image component

export function DashboardPreview() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="bg-primary-light/50 rounded-2xl p-2 shadow-2xl">
        <Image
          src="/images/dashboard-preview.png"
          alt="Dashboard preview"
          width={1160}
          height={700}
          className="w-full h-auto object-cover rounded-xl shadow-lg"
        />
      </div>
    </div>
  )
}

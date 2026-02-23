export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">歡迎來到 Beauty Social Commerce</h1>
      <p className="mt-4 text-lg">KOL 直播帶貨平台</p>
      <div className="mt-8 flex gap-4">
        <a href="/login" className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">登入</a>
        <a href="/orders" className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700">我的訂單</a>
      </div>
    </main>
  )
}

function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <section className="mx-auto flex max-w-5xl flex-col gap-6">
        <p className="text-sm font-medium text-blue-600">Edu Mate</p>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
            首页
          </h1>
          <p className="max-w-2xl text-base text-slate-600">
            欢迎使用 Edu Mate。这里是基于 React Router 管理的首页页面。
          </p>
        </div>
      </section>
    </main>
  )
}

export default Home

import LoginForm from "./components/login-form"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lottery System</h1>
          <p className="text-gray-600">Login to participate or manage lotteries</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}

import { SignIn } from '@clerk/react-router'

export default function LoginPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <SignIn 
          path="/login" 
          routing="path" 
          signUpUrl="/register"
        />
      </div>
    </div>
  )
} 
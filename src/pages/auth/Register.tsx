import { SignUp } from '@clerk/react-router'

export default function RegisterPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <SignUp 
          path="/register" 
          routing="path" 
          signInUrl="/login" 
        />
      </div>
    </div>
  )
} 
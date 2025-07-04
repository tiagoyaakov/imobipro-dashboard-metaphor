import { UserProfile } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Profile() {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Perfil do Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <UserProfile 
              appearance={{
                variables: {
                  colorPrimary: '#0EA5E9',
                  colorBackground: '#0F172A',
                  colorInputBackground: '#1E293B',
                  colorInputText: '#F1F5F9',
                  colorText: '#F1F5F9',
                },
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
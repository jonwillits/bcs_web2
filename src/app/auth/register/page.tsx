import { Suspense } from "react";
import { UnifiedRegistrationForm } from "@/components/auth/unified-registration-form";
import { PublicLayout } from "@/components/layouts/app-layout";

function RegisterContent() {
  return <UnifiedRegistrationForm />;
}

export default function RegisterPage() {
  return (
    <PublicLayout showFooter={false}>
      <Suspense fallback={<div>Loading...</div>}>
        <RegisterContent />
      </Suspense>
    </PublicLayout>
  );
}

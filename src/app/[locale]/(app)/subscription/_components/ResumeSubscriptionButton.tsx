import { Button } from "@/presentation/components/atoms/Button";
import { resumeSubscription } from "@/app/actions/billing";

interface ResumeSubscriptionButtonProps {
  children: React.ReactNode;
}

export function ResumeSubscriptionButton({
  children,
}: ResumeSubscriptionButtonProps) {
  return (
    <form action={resumeSubscription}>
      <Button type="submit" variant="primary">
        {children}
      </Button>
    </form>
  );
}

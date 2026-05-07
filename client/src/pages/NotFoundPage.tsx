import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

export function NotFoundPage() {
  return (
    <div className="min-h-[100vh] bg-[var(--bg)] p-6">
      <div className="mx-auto flex max-w-[720px] items-center justify-center py-16">
        <Card className="w-full p-8 text-center">
          <div className="font-serif text-[28px] text-[var(--text-primary)]">404</div>
          <div className="mt-2 text-[14px] text-[var(--text-secondary)]">This page doesn’t exist.</div>
          <div className="mt-6 flex justify-center">
            <Link to="/">
              <Button variant="secondary">Back to Dashboard</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}


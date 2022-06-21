import { Link } from "@remix-run/react";
import { useWindowSize } from "~/utils";

export default function ChallengeIndexPage() {
  const { width, height } = useWindowSize();

  const isMobile = width ? width < 640 : false;

  return (
    <p>
      No challenge selected. Select a challenge {isMobile ? "above" : "on the left"}, or{" "}

      <Link to="join" className="text-blue-500 underline">
        join an active challenge to start tracking.
      </Link>
    </p>
  );
}

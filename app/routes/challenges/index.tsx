import { Link } from "@remix-run/react";

export default function ChallengeIndexPage() {
  return (
    <p>
      No challenge selected. Select a challenge on the left, or{" "}
      <Link to="join" className="text-blue-500 underline">
        join an active challenge to start tracking.
      </Link>
    </p>
  );
}

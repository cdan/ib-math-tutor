"use client";

import { useParams } from "next/navigation";
import MathWorkspace from "@/components/MathWorkspace";

export default function PracticePage() {
  const params = useParams();
  const course = params.course === "sat" ? "SAT" : "IB";

  return (
    <main className="min-h-screen">
      <MathWorkspace initialCourse={course} />
    </main>
  );
}

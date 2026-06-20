import { redirect } from "next/navigation";

// US is the only location in the MVP — send the homepage straight there.
export default function Home() {
  redirect("/united-states");
}

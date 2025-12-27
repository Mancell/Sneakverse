import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components";
import { AnimatedText } from "@/components/ui/animated-underline-text-one";
import { getCurrentUser } from "@/lib/auth/actions";
import { getAllProducts } from "@/lib/actions/product";

const Home = async () => {
  return (
    <main>
      <div className="p-20 text-center">
        <h1 className="text-4xl font-bold">Nike Store - Under Maintenance</h1>
        <p className="mt-4">Testing if manifest error persists with static content.</p>
      </div>
    </main>
  );
};

export default Home;

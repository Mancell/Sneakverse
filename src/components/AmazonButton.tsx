"use client";

import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAmazon } from "@fortawesome/free-brands-svg-icons";

interface AmazonButtonProps {
  url: string;
}

export default function AmazonButton({ url }: AmazonButtonProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <Button className="w-full bg-gradient-to-b from-[#F7CA00] via-[#F4B800] to-[#F0A800] hover:from-[#F0A800] hover:via-[#E8A000] hover:to-[#E09700] text-[#111] font-semibold rounded-full shadow-md hover:shadow-lg border-2 border-[#A88734] hover:border-[#8B6F1F] text-base px-6 py-4 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
        <FontAwesomeIcon 
          icon={faAmazon} 
          className="mr-3 h-5 w-5 transition-transform duration-300 group-hover:scale-110" 
        />
        View on Amazon
      </Button>
    </a>
  );
}


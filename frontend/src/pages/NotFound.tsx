import React from "react";
import { Link } from "@tanstack/react-router";

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <h1 className="text-3xl font-bold mb-4">404 - Página não encontrada</h1>
      <p className="mb-4">A página que você está procurando não existe.</p>
      <Link to="/" className="text-blue-500 hover:underline">
        Voltar para a página inicial
      </Link>
    </div>
  );
};

export default NotFound;
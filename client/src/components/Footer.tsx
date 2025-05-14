import { Link } from "wouter";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="py-8 bg-black/30 backdrop-filter backdrop-blur-sm border-t border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center gap-2">
              <Logo size="small" />
              <span className="font-orbitron text-lg">Atomic AI</span>
            </div>
            <p className="text-muted-foreground text-sm mt-2">© 2025 Atomic AI – Todos os direitos reservados</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-orbitron mb-4 text-primary">Plataforma</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/landing#features">
                    <a className="text-muted-foreground hover:text-primary transition-colors text-sm">
                      Funcionalidades
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="#">
                    <a className="text-muted-foreground hover:text-primary transition-colors text-sm">
                      Preços
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="#">
                    <a className="text-muted-foreground hover:text-primary transition-colors text-sm">
                      API
                    </a>
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-orbitron mb-4 text-primary">Recursos</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#">
                    <a className="text-muted-foreground hover:text-primary transition-colors text-sm">
                      Documentação
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="#">
                    <a className="text-muted-foreground hover:text-primary transition-colors text-sm">
                      Tutoriais
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="#">
                    <a className="text-muted-foreground hover:text-primary transition-colors text-sm">
                      Exemplos
                    </a>
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-orbitron mb-4 text-primary">Suporte</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#">
                    <a className="text-muted-foreground hover:text-primary transition-colors text-sm">
                      Contato
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="#">
                    <a className="text-muted-foreground hover:text-primary transition-colors text-sm">
                      Status
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="#">
                    <a className="text-muted-foreground hover:text-primary transition-colors text-sm">
                      FAQ
                    </a>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

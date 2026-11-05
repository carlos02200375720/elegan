export interface CompraPerfilProps {
  orders?: Order[];
  activeUser?: User;
  currentUser?: User;
  socket?: WebSocket | null;
  onSelectProduct?: (product: Product) => void;
}


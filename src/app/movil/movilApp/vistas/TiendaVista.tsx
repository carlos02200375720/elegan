import React from "react";
import Tienda from "../../tienda";

type Props = React.ComponentProps<typeof Tienda>;

export default function TiendaVista(props: Props) {
  return <Tienda {...props} />;
}

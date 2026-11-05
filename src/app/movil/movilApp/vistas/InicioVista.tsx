import React from "react";
import Inicio from "../../inicio/Inicio";

type Props = React.ComponentProps<typeof Inicio>;

export default function InicioVista(props: Props) {
  return <Inicio {...props} />;
}

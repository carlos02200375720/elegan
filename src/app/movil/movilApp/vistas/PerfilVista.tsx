import React from "react";
import Perfil from "../../cuenta";

type Props = React.ComponentProps<typeof Perfil>;

export default function PerfilVista(props: Props) {
  return <Perfil {...props} />;
}

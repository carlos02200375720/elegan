import React from "react";
import AdminView from "../../../admin/resumen";

type Props = React.ComponentProps<typeof AdminView>;

export default function AdministracionVista(props: Props) {
  return <AdminView {...props} />;
}

import React from "react";
import SocialPanel from "../../social-panel/SocialPanel";

type Props = React.ComponentProps<typeof SocialPanel>;

export default function MensajesVista(props: Props) {
  return <SocialPanel {...props} />;
}

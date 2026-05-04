import { C } from "../constants/colors";
import Icon from "./Icon";

const SyncBadge = ({status}) => {
  const map = {
    idle:   {color: C.muted,   icon: "sync",  label: "Saved"},
    saving: {color: C.accent,  icon: "sync",  label: "Saving…"},
    saved:  {color: C.accent,  icon: "check", label: "Saved"},
    error:  {color: C.warn,    icon: "sync",  label: "Error"},
  };
  const s = map[status] || map.idle;
  return (
    <div style={{display:"flex", alignItems:"center", gap:5, fontSize:10, color:s.color, opacity:status==="idle"?0:1, transition:"opacity 0.4s"}}>
      <Icon name={s.icon} size={12}/>{s.label}
    </div>
  );
};

export default SyncBadge;

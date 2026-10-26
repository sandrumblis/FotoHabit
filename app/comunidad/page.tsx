import { redirect } from 'next/navigation'

/** La Home es el Feed Social; /comunidad redirige allí. */
export default function ComunidadPage() {
  redirect('/')
}

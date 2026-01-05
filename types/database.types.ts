
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            categorias: {
                Row: {
                    id: number
                    nombre: string
                    slug: string
                    created_at: string
                }
                Insert: {
                    id?: number
                    nombre: string
                    slug: string
                    created_at?: string
                }
                Update: {
                    id?: number
                    nombre?: string
                    slug?: string
                    created_at?: string
                }
            }
            productos: {
                Row: {
                    id: number
                    nombre: string
                    precio: number
                    stock: number
                    imagen_url: string | null
                    imagenes: string[] | null
                    categoria_id: number | null
                    created_at: string
                }
                Insert: {
                    id?: number
                    nombre: string
                    precio: number
                    stock?: number
                    imagen_url?: string | null
                    imagenes?: string[] | null
                    categoria_id?: number | null
                    created_at?: string
                }
                Update: {
                    id?: number
                    nombre?: string
                    precio?: number
                    stock?: number
                    imagen_url?: string | null
                    imagenes?: string[] | null
                    categoria_id?: number | null
                    created_at?: string
                }
            }
            clientes: {
                Row: {
                    id: number
                    nombre: string
                    telefono: string | null
                    dni: string | null
                    direccion: string | null
                    es_problematico: boolean | null
                    created_at: string
                }
                Insert: {
                    id?: number
                    nombre: string
                    telefono?: string | null
                    dni?: string | null
                    direccion?: string | null
                    es_problematico?: boolean | null
                    created_at?: string
                }
                Update: {
                    id?: number
                    nombre?: string
                    telefono?: string | null
                    dni?: string | null
                    direccion?: string | null
                    es_problematico?: boolean | null
                    created_at?: string
                }
            }
            pedidos: {
                Row: {
                    id: number
                    cliente_id: number | null
                    subtotal?: number | null
                    descuento?: number | null
                    cupon_codigo?: string | null
                    total: number
                    stock_descontado: boolean
                    status: 'Pendiente' | 'Confirmado' | 'Preparando' | 'Enviado' | 'Entregado' | 'Fallido' | 'Devuelto'
                    pago_status: 'Pendiente' | 'Pagado Anticipado' | 'Pago Contraentrega' | 'Pagado al Recibir'
                    voucher_url: string | null
                    created_at: string
                }
                Insert: {
                    id?: number
                    cliente_id?: number | null
                    subtotal?: number | null
                    descuento?: number | null
                    cupon_codigo?: string | null
                    total: number
                    stock_descontado?: boolean
                    status?: 'Pendiente' | 'Confirmado' | 'Preparando' | 'Enviado' | 'Entregado' | 'Fallido' | 'Devuelto'
                    pago_status?: 'Pendiente' | 'Pagado Anticipado' | 'Pago Contraentrega' | 'Pagado al Recibir'
                    voucher_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: number
                    cliente_id?: number | null
                    subtotal?: number | null
                    descuento?: number | null
                    cupon_codigo?: string | null
                    total?: number
                    stock_descontado?: boolean
                    status?: 'Pendiente' | 'Confirmado' | 'Preparando' | 'Enviado' | 'Entregado' | 'Fallido' | 'Devuelto'
                    pago_status?: 'Pendiente' | 'Pagado Anticipado' | 'Pago Contraentrega' | 'Pagado al Recibir'
                    voucher_url?: string | null
                    created_at?: string
                }
            }
            pedido_items: {
                Row: {
                    id: number
                    pedido_id: number | null
                    producto_id: number | null
                    cantidad: number
                }
                Insert: {
                    id?: number
                    pedido_id?: number | null
                    producto_id?: number | null
                    cantidad: number
                }
                Update: {
                    id?: number
                    pedido_id?: number | null
                    producto_id?: number | null
                    cantidad?: number
                }
            }
            incidencias: {
                Row: {
                    id: number
                    pedido_id: number | null
                    tipo: string | null
                    comentario: string | null
                    foto: string | null
                    fotos: string[] | null
                    created_at: string
                }
                Insert: {
                    id?: number
                    pedido_id?: number | null
                    tipo?: string | null
                    comentario?: string | null
                    foto?: string | null
                    fotos?: string[] | null
                    created_at?: string
                }
                Update: {
                    id?: number
                    pedido_id?: number | null
                    tipo?: string | null
                    comentario?: string | null
                    foto?: string | null
                    fotos?: string[] | null
                    created_at?: string
                }
            }
            cupones: {
                Row: {
                    id: number
                    codigo: string
                    tipo: 'porcentaje' | 'monto'
                    valor: number
                    activo: boolean
                    min_total: number
                    max_usos: number | null
                    usos: number
                    starts_at: string | null
                    expires_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: number
                    codigo: string
                    tipo?: 'porcentaje' | 'monto'
                    valor: number
                    activo?: boolean
                    min_total?: number
                    max_usos?: number | null
                    usos?: number
                    starts_at?: string | null
                    expires_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: number
                    codigo?: string
                    tipo?: 'porcentaje' | 'monto'
                    valor?: number
                    activo?: boolean
                    min_total?: number
                    max_usos?: number | null
                    usos?: number
                    starts_at?: string | null
                    expires_at?: string | null
                    created_at?: string
                }
            }
        }
    }
}

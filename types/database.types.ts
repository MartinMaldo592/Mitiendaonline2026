
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
                    precio_antes: number | null
                    descripcion?: string | null
                    materiales?: string | null
                    tamano?: string | null
                    color?: string | null
                    cuidados?: string | null
                    uso?: string | null
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
                    precio_antes?: number | null
                    descripcion?: string | null
                    materiales?: string | null
                    tamano?: string | null
                    color?: string | null
                    cuidados?: string | null
                    uso?: string | null
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
                    precio_antes?: number | null
                    descripcion?: string | null
                    materiales?: string | null
                    tamano?: string | null
                    color?: string | null
                    cuidados?: string | null
                    uso?: string | null
                    stock?: number
                    imagen_url?: string | null
                    imagenes?: string[] | null
                    categoria_id?: number | null
                    created_at?: string
                }
            }

            producto_variantes: {
                Row: {
                    id: number
                    producto_id: number
                    etiqueta: string
                    talla: string | null
                    color: string | null
                    modelo: string | null
                    precio: number | null
                    precio_antes: number | null
                    stock: number
                    activo: boolean
                    created_at: string
                }
                Insert: {
                    id?: number
                    producto_id: number
                    etiqueta: string
                    talla?: string | null
                    color?: string | null
                    modelo?: string | null
                    precio?: number | null
                    precio_antes?: number | null
                    stock?: number
                    activo?: boolean
                    created_at?: string
                }
                Update: {
                    id?: number
                    producto_id?: number
                    etiqueta?: string
                    talla?: string | null
                    color?: string | null
                    modelo?: string | null
                    precio?: number | null
                    precio_antes?: number | null
                    stock?: number
                    activo?: boolean
                    created_at?: string
                }
            }

            producto_especificaciones: {
                Row: {
                    id: number
                    producto_id: number
                    clave: string
                    valor: string | null
                    orden: number
                    created_at: string
                }
                Insert: {
                    id?: number
                    producto_id: number
                    clave: string
                    valor?: string | null
                    orden?: number
                    created_at?: string
                }
                Update: {
                    id?: number
                    producto_id?: number
                    clave?: string
                    valor?: string | null
                    orden?: number
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
                    producto_variante_id?: number | null
                    precio_unitario?: number | null
                    producto_nombre?: string | null
                    variante_nombre?: string | null
                    cantidad: number
                }
                Insert: {
                    id?: number
                    pedido_id?: number | null
                    producto_id?: number | null
                    producto_variante_id?: number | null
                    precio_unitario?: number | null
                    producto_nombre?: string | null
                    variante_nombre?: string | null
                    cantidad: number
                }
                Update: {
                    id?: number
                    pedido_id?: number | null
                    producto_id?: number | null
                    producto_variante_id?: number | null
                    precio_unitario?: number | null
                    producto_nombre?: string | null
                    variante_nombre?: string | null
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

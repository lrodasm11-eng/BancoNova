
// ========================================
// CONFIGURACION INICIAL
// ========================================

const CREDENCIALES = {
    usuario: "admin",
    clave: "2026"
};

const LIMITE_DIARIO = 30000;
const SALDO_INICIAL = 1500;

// Elementos principales
const pantallaLogin = document.getElementById("pantallaLogin");
const menuPrincipal = document.getElementById("menuPrincipal");
const formLogin = document.getElementById("formLogin");
const mensajeLogin = document.getElementById("mensajeLogin");

// Variables del sistema
let saldoActual = SALDO_INICIAL;
let movimientos = [];
let transferidoHoy = 0;
let fechaLimite = obtenerFechaActual();
let transferenciaPendiente = null;

// ========================================
// ALMACENAMIENTO DE INFORMACION
// ========================================

// Cargar los datos guardados en el navegador
function cargarDatos() {
    try {
        const saldoGuardado = localStorage.getItem("bancoNovaSaldo");
        const movimientosGuardados =
            localStorage.getItem("bancoNovaMovimientos");

        if (saldoGuardado !== null) {
            const saldoNumero = Number(saldoGuardado);

            if (Number.isFinite(saldoNumero) && saldoNumero >= 0) {
                saldoActual = saldoNumero;
            }
        }

        if (movimientosGuardados !== null) {
            const lista = JSON.parse(movimientosGuardados);

            if (Array.isArray(lista)) {
                movimientos = lista;
            }
        }

    } catch (error) {
        console.error("No se pudieron cargar los datos:", error);
    }

    // Cargar limite diario
    fechaLimite = obtenerFechaActual();

    const fechaGuardada =
        localStorage.getItem("bancoNovaFechaLimite");

    if (fechaGuardada === fechaLimite) {
        const cantidadGuardada = Number(
            localStorage.getItem("bancoNovaTransferidoHoy") || 0
        );

        transferidoHoy =
            Number.isFinite(cantidadGuardada) &&
            cantidadGuardada >= 0
                ? cantidadGuardada
                : 0;

    } else {
        transferidoHoy = 0;
        guardarLimiteDiario();
    }
}

// Guardar saldo e historial
function guardarDatos() {
    try {
        localStorage.setItem(
            "bancoNovaSaldo",
            String(saldoActual)
        );

        localStorage.setItem(
            "bancoNovaMovimientos",
            JSON.stringify(movimientos)
        );

        return true;

    } catch (error) {
        console.error("No se pudieron guardar los datos:", error);
        return false;
    }
}

// Guardar el limite diario
function guardarLimiteDiario() {
    try {
        localStorage.setItem(
            "bancoNovaTransferidoHoy",
            String(transferidoHoy)
        );

        localStorage.setItem(
            "bancoNovaFechaLimite",
            fechaLimite
        );

    } catch (error) {
        console.error("No se pudo guardar el límite diario:", error);
    }
}

// ========================================
// FECHA Y FORMATO DE DINERO
// ========================================

function obtenerFechaActual() {
    const fecha = new Date();

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return anio + "-" + mes + "-" + dia;
}

function formatoDinero(cantidad) {
    return cantidad.toLocaleString("es-GT", {
        style: "currency",
        currency: "GTQ",
        minimumFractionDigits: 2
    });
}

// ========================================
// INICIO DE SESION
// ========================================

formLogin.addEventListener("submit", function(evento) {
    evento.preventDefault();

    const usuario =
        document.getElementById("usuario").value.trim();

    const clave =
        document.getElementById("clave").value;

    if (
        usuario === CREDENCIALES.usuario &&
        clave === CREDENCIALES.clave
    ) {
        document.getElementById("nombreUsuario").textContent = usuario;
        document.getElementById("nombreConsulta").textContent = usuario;

        mensajeLogin.textContent = "";
        mensajeLogin.className = "mensaje";

        pantallaLogin.classList.add("oculto");
        menuPrincipal.classList.remove("oculto");

        mostrarPagina("menuPrincipal");
        actualizarInformacion();

    } else {
        mensajeLogin.textContent =
            "Usuario o contraseña incorrectos.";

        mensajeLogin.className = "mensaje error";
    }
});

// ========================================
// CAMBIAR ENTRE PAGINAS
// ========================================

function mostrarPagina(idPagina) {
    menuPrincipal.classList.add("oculto");

    document.querySelectorAll(".pagina").forEach(function(pagina) {
        pagina.classList.add("oculto");
    });

    if (idPagina === "menuPrincipal") {
        menuPrincipal.classList.remove("oculto");

    } else {
        document.getElementById(idPagina).classList.remove("oculto");
    }

    actualizarInformacion();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// Botones de operaciones
document.querySelectorAll(".operacion").forEach(function(boton) {
    boton.addEventListener("click", function() {
        mostrarPagina(boton.dataset.pagina);
    });
});

// Botones para regresar al menu
document.querySelectorAll(".volver").forEach(function(boton) {
    boton.addEventListener("click", function() {
        mostrarPagina("menuPrincipal");
    });
});

// ========================================
// CERRAR SESION
// ========================================

document.getElementById("cerrarSesion").addEventListener(
    "click",
    function() {
        menuPrincipal.classList.add("oculto");

        document.querySelectorAll(".pagina").forEach(function(pagina) {
            pagina.classList.add("oculto");
        });

        pantallaLogin.classList.remove("oculto");

        formLogin.reset();
        mensajeLogin.textContent = "";
        mensajeLogin.className = "mensaje";
    }
);

// ========================================
// ACTUALIZAR LIMITE DIARIO
// ========================================

function actualizarLimiteDiario() {
    const fechaActual = obtenerFechaActual();

    // Reiniciar el limite al cambiar de dia
    if (fechaActual !== fechaLimite) {
        fechaLimite = fechaActual;
        transferidoHoy = 0;
        guardarLimiteDiario();
    }

    const disponible = Math.max(
        0,
        LIMITE_DIARIO - transferidoHoy
    );

    const porcentajeUtilizado =
        (transferidoHoy / LIMITE_DIARIO) * 100;

    document.getElementById("limiteDisponible").textContent =
        formatoDinero(disponible);

    document.getElementById("limiteUtilizado").textContent =
        formatoDinero(transferidoHoy);

    const barra = document.getElementById("barraLimite");

    barra.style.width =
        Math.min(100, porcentajeUtilizado) + "%";

    if (porcentajeUtilizado >= 90) {
        barra.style.background = "#c0392b";

    } else if (porcentajeUtilizado >= 70) {
        barra.style.background = "#e69a24";

    } else {
        barra.style.background = "#16865b";
    }
}

// ========================================
// ALERTAS PERSONALIZADAS
// ========================================

function mostrarAlertaTransferencia(texto, correcto) {
    const alerta =
        document.getElementById("alertaTransferencia");

    const icono =
        document.getElementById("iconoAlerta");

    const titulo =
        document.getElementById("tituloAlerta");

    const mensaje =
        document.getElementById("textoAlerta");

    alerta.classList.remove("oculto", "exito", "error");

    alerta.classList.add(correcto ? "exito" : "error");

    icono.textContent = correcto ? "✓" : "!";

    titulo.textContent = correcto
        ? "¡Transferencia exitosa!"
        : "Alerta de seguridad";

    mensaje.textContent = texto;
}

// ========================================
// FUNCIONES DE LOS MOVIMIENTOS
// ========================================

function registrarMovimiento(descripcion, cantidad) {
    movimientos.unshift({
        fecha: new Date().toLocaleString("es-GT"),
        descripcion: descripcion,
        cantidad: cantidad
    });

    // Guardar los movimientos y el saldo
    guardarDatos();
}

// ========================================
// PROCESAR DEPOSITOS Y RETIROS
// ========================================

document.querySelectorAll(".pagina form").forEach(
    function(formulario) {

        formulario.addEventListener("submit", function(evento) {
            evento.preventDefault();

            const tipo = formulario.dataset.tipo;

            if (!tipo || tipo === "transferencia") {
                return;
            }

            const resultado =
                formulario.querySelector(".resultado");

            resultado.textContent = "";
            resultado.className = "resultado";

            let cantidad;
            let descripcion;

            if (tipo === "deposito") {
                cantidad = Number(
                    document.getElementById("montoDeposito").value
                );

                descripcion = "Depósito";
            }

            if (tipo === "retiro") {
                cantidad = Number(
                    document.getElementById("montoRetiro").value
                );

                descripcion = "Retiro";
            }

            // Validar el monto
            if (!Number.isFinite(cantidad) || cantidad <= 0) {
                mostrarResultado(
                    resultado,
                    "Ingresa un monto mayor que cero.",
                    false
                );

                return;
            }

            // Realizar deposito
            if (tipo === "deposito") {
                saldoActual += cantidad;
            }

            // Realizar retiro
            if (tipo === "retiro") {

                if (cantidad > saldoActual) {
                    mostrarResultado(
                        resultado,
                        "No tienes suficiente saldo para realizar este retiro.",
                        false
                    );

                    return;
                }

                saldoActual -= cantidad;
            }

            // Registrar el movimiento
            registrarMovimiento(
                descripcion,
                tipo === "deposito" ? cantidad : -cantidad
            );

            actualizarInformacion();

            mostrarResultado(
                resultado,
                "¡Operación realizada correctamente! Nuevo saldo: " +
                formatoDinero(saldoActual),
                true
            );

            formulario.reset();
        });
    }
);

// ========================================
// INFORMACION DE CUENTA DESTINO
// ========================================

const cuentaDestino =
    document.getElementById("cuentaDestino");

function actualizarResumenTransferencia() {
    const resumen =
        document.getElementById("resumenDestino");

    if (!cuentaDestino.value) {
        resumen.textContent = "";
        return;
    }

    if (cuentaDestino.value === "100002") {
        resumen.textContent =
            "Destinatario: Carlos Méndez | Cuenta: 100002";

    } else if (cuentaDestino.value === "100003") {
        resumen.textContent =
            "Destinataria: Ana López | Cuenta: 100003";
    }
}

cuentaDestino.addEventListener(
    "change",
    actualizarResumenTransferencia
);

// ========================================
// CONFIRMACION DE TRANSFERENCIA
// ========================================

const formularioTransferencia =
    document.querySelector(
        'form[data-tipo="transferencia"]'
    );

const modalConfirmacion =
    document.getElementById("modalConfirmacion");

const botonCancelar =
    document.getElementById("cancelarTransferencia");

const botonAceptar =
    document.getElementById("aceptarTransferencia");

// Cuando se envía el formulario, primero se revisan los datos
formularioTransferencia.addEventListener(
    "submit",
    function(evento) {
        evento.preventDefault();

        const resultado =
            formularioTransferencia.querySelector(".resultado");

        resultado.textContent = "";
        resultado.className = "resultado";

        document.getElementById("alertaTransferencia")
            .classList.add("oculto");

        const cuenta = cuentaDestino.value;

        const cantidad = Number(
            document.getElementById("montoTransferencia").value
        );

        // Comprobar cuenta
        if (!cuenta) {
            mostrarAlertaTransferencia(
                "Selecciona una cuenta de destino.",
                false
            );

            return;
        }

        // Comprobar monto
        if (!Number.isFinite(cantidad) || cantidad <= 0) {
            mostrarAlertaTransferencia(
                "Ingresa un monto mayor que cero.",
                false
            );

            return;
        }

        actualizarLimiteDiario();

        const disponible = LIMITE_DIARIO - transferidoHoy;

        // Comprobar límite por operación
        if (cantidad > LIMITE_DIARIO) {
            mostrarAlertaTransferencia(
                "No puedes transferir más de Q 30,000.00 en una sola operación.",
                false
            );

            return;
        }

        // Comprobar límite diario
        if (cantidad > disponible) {
            mostrarAlertaTransferencia(
                "Has superado tu límite diario. Solamente tienes " +
                formatoDinero(disponible) +
                " disponibles para transferir.",
                false
            );

            return;
        }

        // Comprobar saldo
        if (cantidad > saldoActual) {
            mostrarAlertaTransferencia(
                "No tienes suficiente saldo para realizar esta transferencia.",
                false
            );

            return;
        }

        // Obtener datos del destinatario
        const opcion =
            cuentaDestino.options[cuentaDestino.selectedIndex];

        const destinatario = opcion.text;

        // Guardar los datos temporalmente
        transferenciaPendiente = {
            cuenta: cuenta,
            destinatario: destinatario,
            cantidad: cantidad
        };

        // Mostrar los datos en la ventana de confirmación
        document.getElementById("confirmarDestinatario")
            .textContent = destinatario;

        document.getElementById("confirmarCuenta")
            .textContent = cuenta;

        document.getElementById("confirmarMonto")
            .textContent = formatoDinero(cantidad);

        document.getElementById("confirmarSaldo")
            .textContent = formatoDinero(saldoActual - cantidad);

        modalConfirmacion.classList.remove("oculto");
    }
);

// Cancelar transferencia
botonCancelar.addEventListener("click", function() {
    modalConfirmacion.classList.add("oculto");
    transferenciaPendiente = null;
});

// Confirmar y realizar transferencia
botonAceptar.addEventListener("click", function() {

    if (!transferenciaPendiente) {
        return;
    }

    const datos = transferenciaPendiente;
    const cantidad = datos.cantidad;

    actualizarLimiteDiario();

    const disponible = LIMITE_DIARIO - transferidoHoy;

    // Volver a validar antes de completar la operación
    if (
        cantidad <= 0 ||
        cantidad > LIMITE_DIARIO ||
        cantidad > disponible ||
        cantidad > saldoActual
    ) {
        modalConfirmacion.classList.add("oculto");

        mostrarAlertaTransferencia(
            "No fue posible completar la transferencia. Verifica tu saldo y el límite diario.",
            false
        );

        transferenciaPendiente = null;
        return;
    }

    // Descontar el dinero
    saldoActual -= cantidad;

    // Actualizar el límite utilizado
    transferidoHoy += cantidad;
    guardarLimiteDiario();

    // Crear número de operación
    const numeroOperacion =
        "BN" + Date.now().toString().slice(-10);

    // Guardar movimiento
    movimientos.unshift({
        fecha: new Date().toLocaleString("es-GT"),
        descripcion: "Transferencia a " + datos.destinatario,
        cantidad: -cantidad,
        numeroOperacion: numeroOperacion
    });

    // Guardar todos los datos
    guardarDatos();

    // Actualizar la pantalla
    actualizarInformacion();

    // Cerrar confirmación
    modalConfirmacion.classList.add("oculto");

    // Mostrar alerta de éxito
    mostrarAlertaTransferencia(
        "Tu transferencia se realizó correctamente.",
        true
    );

    // Mostrar comprobante
    mostrarComprobante({
        numero: numeroOperacion,
        fecha: new Date().toLocaleString("es-GT"),
        destinatario: datos.destinatario,
        cuenta: datos.cuenta,
        cantidad: cantidad,
        saldo: saldoActual
    });

    // Limpiar formulario
    formularioTransferencia.reset();

    actualizarResumenTransferencia();

    // Limpiar datos pendientes
    transferenciaPendiente = null;
});

// ========================================
// MOSTRAR COMPROBANTE
// ========================================

function mostrarComprobante(datos) {

    document.getElementById("comprobanteNumero")
        .textContent = datos.numero;

    document.getElementById("comprobanteFecha")
        .textContent = datos.fecha;

    document.getElementById("comprobanteDestinatario")
        .textContent = datos.destinatario;

    document.getElementById("comprobanteCuenta")
        .textContent = datos.cuenta;

    document.getElementById("comprobanteMonto")
        .textContent = formatoDinero(datos.cantidad);

    document.getElementById("comprobanteSaldo")
        .textContent = formatoDinero(datos.saldo);

    document.getElementById("modalComprobante")
        .classList.remove("oculto");
}

// Cerrar comprobante
document.getElementById("cerrarComprobante")
    .addEventListener("click", function() {
        document.getElementById("modalComprobante")
            .classList.add("oculto");
    });

// Imprimir comprobante
document.getElementById("imprimirComprobante")
    .addEventListener("click", function() {
        window.print();
    });

// ========================================
// ACTUALIZAR INFORMACION DE LA CUENTA
// ========================================

function actualizarInformacion() {

    document.getElementById("saldoMenu").textContent =
        formatoDinero(saldoActual);

    document.getElementById("saldoConsulta").textContent =
        formatoDinero(saldoActual);

    document.querySelectorAll(".saldoActual").forEach(
        function(elemento) {
            elemento.textContent = formatoDinero(saldoActual);
        }
    );

    document.getElementById("totalMovimientos").textContent =
        movimientos.length;

    mostrarMovimientos("listaMovimientos");
    mostrarMovimientos("movimientosConsulta");

    actualizarLimiteDiario();
}

// ========================================
// MOSTRAR HISTORIAL DE MOVIMIENTOS
// ========================================

function mostrarMovimientos(idTabla) {
    const contenedor = document.getElementById(idTabla);

    contenedor.innerHTML = "";

    if (movimientos.length === 0) {
        const mensaje = document.createElement("p");

        mensaje.className = "vacio";
        mensaje.textContent = "Todavía no hay movimientos.";

        contenedor.appendChild(mensaje);
        return;
    }

    movimientos.slice(0, 10).forEach(function(movimiento) {

        const fila = document.createElement("div");
        fila.className = "movimiento";

        const informacion = document.createElement("div");

        const descripcion = document.createElement("strong");
        descripcion.textContent = movimiento.descripcion;

        const fecha = document.createElement("small");
        fecha.textContent = movimiento.fecha;

        informacion.appendChild(descripcion);
        informacion.appendChild(fecha);

        const monto = document.createElement("span");

        monto.textContent =
            (movimiento.cantidad > 0 ? "+" : "") +
            formatoDinero(movimiento.cantidad);

        monto.className =
            movimiento.cantidad > 0
                ? "positivo"
                : "negativo";

        fila.appendChild(informacion);
        fila.appendChild(monto);

        contenedor.appendChild(fila);
    });
}

// ========================================
// MENSAJES DE DEPOSITOS Y RETIROS
// ========================================

function mostrarResultado(elemento, texto, correcto) {
    elemento.textContent = texto;

    elemento.className = correcto
        ? "resultado exito"
        : "resultado error";
}

// ========================================
// INICIAR EL SISTEMA
// ========================================

// Recuperar los datos guardados al abrir la página
cargarDatos();

// Mostrar información actualizada
actualizarInformacion();

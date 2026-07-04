from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3000"


def client_route(page, path):
    page.evaluate("path => { history.pushState({}, '', path); dispatchEvent(new PopStateEvent('popstate')); }", path)
    page.wait_for_timeout(250)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.set_default_timeout(30_000)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.route("https://*.tile.openstreetmap.org/**", lambda route: route.abort())

    page.goto(BASE, wait_until="domcontentloaded", timeout=120_000)
    page.evaluate("localStorage.clear()")
    page.reload(wait_until="domcontentloaded")

    client_route(page, "/search")
    page.wait_for_selector(".leaflet-container")
    page.get_by_text("Explorando proveedores disponibles").wait_for()
    clusters = page.locator(".provider-map-cluster")
    assert clusters.count() == 10, f"Expected 10 city clusters, got {clusters.count()}"
    clusters.first.dispatch_event("click")
    page.locator(".provider-map-touchpoint").first.wait_for()
    page.locator(".provider-map-touchpoint").first.dispatch_event("click")
    page.locator(".map-provider-preview").wait_for(state="visible")

    client_route(page, "/me")
    page.get_by_role("heading", name="Mi perfil").wait_for()
    assert page.get_by_text("No pudimos mostrar esta página").count() == 0

    client_route(page, "/providers/provider-2")
    offer = page.get_by_role("heading", name="Empaque kraft personalizado")
    offer.wait_for()
    offer.locator("xpath=ancestor::article").get_by_role("link", name="Ver detalle").click()
    page.get_by_role("heading", name="Empaque kraft personalizado").wait_for()
    page.get_by_role("link", name="Consultar por este producto").click()
    page.get_by_role("heading", name="Cotizá con Empaques Ceibo León").wait_for()
    assert page.get_by_role("button", name="Chatear y solicitar cotización").is_enabled()

    client_route(page, "/requests/request-9/chat")
    page.get_by_role("heading", name="Conversaciones").wait_for()
    assert page.get_by_text("Tu rol: Proveedor").is_visible()
    assert page.get_by_role("button", name="Confirmar como cliente").count() == 0
    before = page.locator(".chat-message").count()
    page.locator(".message-composer textarea").fill("Mensaje de verificación del chat")
    page.locator(".message-composer").get_by_role("button", name="Enviar").click()
    assert page.locator(".chat-message").count() == before + 1
    page.get_by_role("button", name="Enviar precio estimado").click()
    page.locator(".quote-composer input").nth(0).fill("C$1,450")
    page.locator(".quote-composer input").nth(1).fill("6 días")
    page.locator(".quote-composer").get_by_role("button", name="Enviar cotización").click()
    page.get_by_text("Cotización estimada: C$1,450").last.wait_for()

    client_route(page, "/formalization")
    first_step = page.locator(".step-list button").first
    before_state = first_step.get_attribute("aria-pressed")
    first_step.click()
    client_route(page, "/me")
    client_route(page, "/formalization")
    assert page.locator(".step-list button").first.get_attribute("aria-pressed") != before_state

    client_route(page, "/admin/reports")
    page.get_by_role("heading", name="Revisión de reportes").wait_for()
    assert page.get_by_role("button", name="Marcar revisado").count() >= 1

    client_route(page, "/settings/security")
    page.get_by_role("button", name="Cerrar sesión").click()
    client_route(page, "/requests")
    page.get_by_role("heading", name="Iniciá sesión para continuar").wait_for()

    assert not errors, errors
    print("PROFILE_CHAT_MAP_OK")
    browser.close()

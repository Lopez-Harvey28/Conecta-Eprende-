from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3000"


def client_route(page, path):
    page.evaluate("path => { history.pushState({}, '', path); dispatchEvent(new PopStateEvent('popstate')); }", path)
    page.wait_for_timeout(150)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.set_default_timeout(120_000)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.route("https://*.tile.openstreetmap.org/**", lambda route: route.abort())

    page.goto(BASE, wait_until="commit", timeout=120_000)
    client_route(page, "/search")
    page.wait_for_selector(".leaflet-container")
    markers = page.locator(".provider-map-touchpoint")
    assert markers.count() == 50, f"Expected 50 touchpoints, got {markers.count()}"
    markers.first.dispatch_event("click")
    page.locator(".map-provider-preview").wait_for(state="visible")
    assert page.locator(".map-provider-preview").get_by_role("link", name="Ver perfil").is_visible()

    client_route(page, "/providers/provider-2")
    page.get_by_role("heading", name="Productos y servicios").wait_for()
    offer = page.get_by_role("heading", name="Empaque kraft personalizado")
    offer.wait_for()
    offer.locator("xpath=ancestor::article").get_by_role("link", name="Ver detalle").click()
    page.get_by_role("heading", name="Empaque kraft personalizado").wait_for()
    page.get_by_role("link", name="Consultar por este producto").click()
    page.get_by_role("heading", name="Solicitar cotización").wait_for()
    assert page.locator("text=Empaque kraft personalizado").count() >= 1

    client_route(page, "/requests/request-6/chat")
    page.get_by_role("heading", name="Conversaciones").wait_for()
    assert page.locator(".chat-conversations").is_visible()
    assert page.locator(".chat-thread").is_visible()
    assert page.locator(".chat-context").is_visible()
    before = page.locator(".chat-message").count()
    page.locator(".message-composer textarea").fill("Mensaje de verificación del chat")
    page.locator(".message-composer").get_by_role("button", name="Enviar").click()
    assert page.locator(".chat-message").count() == before + 1
    page.get_by_role("button", name="Enviar precio estimado").click()
    page.locator(".quote-composer input").nth(0).fill("C$1,450")
    page.locator(".quote-composer input").nth(1).fill("6 días")
    page.locator(".quote-composer").get_by_role("button", name="Enviar cotización").click()
    page.locator(".system-message.type-quote_summary").last.wait_for()

    assert not errors, errors
    print("PROFILE_CHAT_MAP_OK")
    browser.close()

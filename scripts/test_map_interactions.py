from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:3000/search?query=Empaques%20ecol%C3%B3gicos%20en%20Le%C3%B3n"


def open_search(page):
    page.goto("http://127.0.0.1:3000", wait_until="domcontentloaded", timeout=120_000)
    page.evaluate("history.pushState({}, '', '/search?query=Empaques%20ecol%C3%B3gicos%20en%20Le%C3%B3n'); dispatchEvent(new PopStateEvent('popstate'))")
    page.wait_for_timeout(250)


def verify_desktop(page):
    page.set_viewport_size({"width": 1440, "height": 900})
    open_search(page)
    page.wait_for_selector(".leaflet-container")
    panel_box = page.locator(".map-panel").bounding_box()
    assert panel_box and panel_box["width"] >= 300 and panel_box["x"] < 1440, panel_box
    marker = page.locator(".provider-map-touchpoint")
    assert marker.count() == 1, f"Expected one marker, got {marker.count()}"
    marker.dispatch_event("click")
    preview = page.locator(".map-provider-preview")
    preview.wait_for(state="visible")
    assert "Empaques Ceibo León" in preview.inner_text()
    assert page.locator(".provider-result.map-linked-active").count() == 1
    preview.get_by_role("button", name="Ver en lista").click()
    card_position = page.locator(".provider-result.map-linked-active").evaluate(
        "el => ({top: el.getBoundingClientRect().top, bottom: el.getBoundingClientRect().bottom})"
    )
    assert card_position["bottom"] > 0 and card_position["top"] < 900


def verify_mobile(page):
    page.set_viewport_size({"width": 390, "height": 844})
    open_search(page)
    map_button = page.get_by_role("button", name="Mapa")
    map_button.click()
    page.wait_for_selector(".map-panel.mobile-active .leaflet-container")
    marker = page.locator(".map-panel.mobile-active .provider-map-touchpoint")
    assert marker.count() == 1
    marker.dispatch_event("click")
    preview = page.locator(".map-provider-preview")
    preview.wait_for(state="visible")
    assert preview.get_by_role("button", name="Ver en lista").is_visible()
    preview.get_by_role("button", name="Ver en lista").click()
    assert page.get_by_role("button", name="Lista").get_attribute("class") and "active" in page.get_by_role("button", name="Lista").get_attribute("class")
    assert page.locator(".results.mobile-active .provider-result.map-linked-active").count() == 1


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.set_default_timeout(120_000)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.route("https://*.tile.openstreetmap.org/**", lambda route: route.abort())
    verify_desktop(page)
    verify_mobile(page)
    assert not errors, errors
    print("MAP_INTERACTIONS_OK")
    browser.close()

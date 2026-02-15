from django.urls import path

from . import views

app_name = "billing"

urlpatterns = [
    # Subscriptions
    path("pricing/", views.PricingView.as_view(), name="pricing"),
    path(
        "subscribe/<slug:slug>/",
        views.SubscriptionCheckoutView.as_view(),
        name="subscribe",
    ),
    path(
        "subscription/success/",
        views.SubscriptionSuccessView.as_view(),
        name="subscription-success",
    ),
    path(
        "subscription/cancel/",
        views.SubscriptionCancelView.as_view(),
        name="subscription-cancel",
    ),
    path(
        "subscription/",
        views.MySubscriptionView.as_view(),
        name="my-subscription",
    ),
    # Shop
    path("shop/", views.ShopView.as_view(), name="shop"),
    path(
        "shop/<slug:slug>/",
        views.ProductDetailView.as_view(),
        name="product-detail",
    ),
    path(
        "cart/add/<slug:slug>/",
        views.AddToCartView.as_view(),
        name="add-to-cart",
    ),
    path("cart/", views.CartView.as_view(), name="cart"),
    path(
        "cart/update/<slug:slug>/",
        views.UpdateCartView.as_view(),
        name="update-cart",
    ),
    path(
        "cart/remove/<slug:slug>/",
        views.RemoveFromCartView.as_view(),
        name="remove-from-cart",
    ),
    path("checkout/", views.CheckoutView.as_view(), name="checkout"),
    # Orders
    path("orders/", views.OrderListView.as_view(), name="order-list"),
    path(
        "orders/<uuid:pk>/",
        views.OrderDetailView.as_view(),
        name="order-detail",
    ),
    path(
        "orders/<uuid:pk>/success/",
        views.OrderSuccessView.as_view(),
        name="order-success",
    ),
    # Invoices
    path(
        "invoices/<uuid:pk>/",
        views.InvoiceDetailView.as_view(),
        name="invoice-detail",
    ),
]

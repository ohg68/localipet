from django.urls import path

from . import views

app_name = "organizations"

urlpatterns = [
    # Org selection / creation
    path("select/", views.SelectOrganizationView.as_view(), name="select-org"),
    path("create/", views.CreateOrganizationView.as_view(), name="create"),
    path("switch/<uuid:pk>/", views.SwitchOrganizationView.as_view(), name="switch"),

    # Org Dashboard
    path("dashboard/", views.OrgDashboardView.as_view(), name="dashboard"),

    # Settings
    path("settings/", views.OrgSettingsView.as_view(), name="settings"),
    path(
        "settings/edit/",
        views.OrgSettingsUpdateView.as_view(),
        name="settings-edit",
    ),

    # Staff management
    path("staff/", views.StaffListView.as_view(), name="staff-list"),
    path("staff/invite/", views.StaffInviteView.as_view(), name="staff-invite"),
    path(
        "staff/<uuid:pk>/edit/",
        views.StaffEditView.as_view(),
        name="staff-edit",
    ),
    path(
        "staff/<uuid:pk>/remove/",
        views.StaffRemoveView.as_view(),
        name="staff-remove",
    ),

    # Client management
    path("clients/", views.ClientListView.as_view(), name="client-list"),
    path("clients/add/", views.ClientAddView.as_view(), name="client-add"),
    path(
        "clients/import/",
        views.ClientImportView.as_view(),
        name="client-import",
    ),
    path(
        "clients/<uuid:pk>/",
        views.ClientDetailView.as_view(),
        name="client-detail",
    ),
    path(
        "clients/<uuid:pk>/remove/",
        views.ClientRemoveView.as_view(),
        name="client-remove",
    ),

    # Org billing / subscription
    path("billing/plans/", views.OrgPricingView.as_view(), name="org-pricing"),
    path(
        "billing/subscribe/<slug:slug>/",
        views.OrgSubscribeView.as_view(),
        name="org-subscribe",
    ),
    path(
        "billing/subscription/",
        views.OrgSubscriptionView.as_view(),
        name="org-subscription",
    ),

    # Sales (orders on behalf of clients)
    path("sales/", views.SalesListView.as_view(), name="sales-list"),
    path("sales/new/", views.NewSaleView.as_view(), name="new-sale"),
    path(
        "sales/<uuid:pk>/",
        views.SaleDetailView.as_view(),
        name="sale-detail",
    ),

    # Bulk operations
    path("bulk/labels/", views.BulkLabelView.as_view(), name="bulk-labels"),
    path(
        "bulk/labels/generate/",
        views.BulkLabelGenerateView.as_view(),
        name="bulk-labels-generate",
    ),

    # Invitation acceptance (token-based, public)
    path(
        "invite/<str:token>/",
        views.AcceptInvitationView.as_view(),
        name="accept-invite",
    ),
]

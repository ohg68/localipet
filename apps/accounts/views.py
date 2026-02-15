from django.contrib.auth import login
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.views import LoginView, LogoutView
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.views.generic import CreateView, UpdateView, DetailView

from .forms import OwnerRegistrationForm, VetRegistrationForm, ProfileForm
from .models import Profile


class CustomLoginView(LoginView):
    template_name = "accounts/login.html"
    redirect_authenticated_user = True


class CustomLogoutView(LogoutView):
    next_page = "accounts:login"


class OwnerRegisterView(CreateView):
    form_class = OwnerRegistrationForm
    template_name = "accounts/register.html"
    success_url = reverse_lazy("dashboard")

    def form_valid(self, form):
        response = super().form_valid(form)
        login(self.request, self.object)
        return response


class VetRegisterView(CreateView):
    form_class = VetRegistrationForm
    template_name = "accounts/register_vet.html"
    success_url = reverse_lazy("dashboard")

    def form_valid(self, form):
        user = form.save()
        # Update profile with vet/shop specific fields
        profile = user.profile
        profile.role = form.cleaned_data["role"]
        profile.business_name = form.cleaned_data["business_name"]
        profile.license_number = form.cleaned_data["license_number"]
        profile.save()
        login(self.request, user)
        return redirect(self.success_url)


class ProfileView(LoginRequiredMixin, DetailView):
    model = Profile
    template_name = "accounts/profile.html"

    def get_object(self, queryset=None):
        return self.request.user.profile


class ProfileUpdateView(LoginRequiredMixin, UpdateView):
    model = Profile
    form_class = ProfileForm
    template_name = "accounts/profile_edit.html"
    success_url = reverse_lazy("accounts:profile")

    def get_object(self, queryset=None):
        return self.request.user.profile

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import PocketBase from 'pocketbase';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-nuevo-destino',
    standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './nuevo-destino.html',
  styleUrl: './nuevo-destino.css',
})
export class NuevoDestino {
  destinationForm: FormGroup;
  loading = false;

  mainImageFile: File | null = null;
  galleryFiles: File[] = [];

  mainImagePreview: string | null = null;
  galleryPreviews: string[] = [];

  pb = new PocketBase('https://db.buckapi.site:8015');

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.destinationForm = this.fb.group({
      name: ['', Validators.required],
      slug: ['', Validators.required],
      country: ['', Validators.required],
      region: [''],
      city: [''],
      shortDescription: [''],
      fullDescription: [''],
      isFeatured: [false],
      isActive: [true]
    });

    this.destinationForm.get('name')?.valueChanges.subscribe((value: string) => {
      const currentSlug = this.destinationForm.get('slug')?.value;
      if (!currentSlug) {
        this.destinationForm.patchValue(
          { slug: this.generateSlug(value || '') },
          { emitEvent: false }
        );
      }
    });
  }

  isInvalid(field: string): boolean {
    const control = this.destinationForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  generateSlug(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  onMainImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    this.mainImageFile = file;
    this.mainImagePreview = null;

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.mainImagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onGalleryChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];

    this.galleryFiles = files;
    this.galleryPreviews = [];

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        this.galleryPreviews.push(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

async onSubmit(): Promise<void> {
  if (this.destinationForm.invalid) {
    this.destinationForm.markAllAsTouched();

    Swal.fire({
      icon: 'warning',
      title: 'Formulario incompleto',
      text: 'Por favor completa todos los campos obligatorios.',
      confirmButtonText: 'Entendido'
    });

    return;
  }

  this.loading = true;
Swal.fire({
  title: 'Guardando destino...',
  text: 'Por favor espera',
  allowOutsideClick: false,
  didOpen: () => {
    Swal.showLoading();
  }
});
  try {
    const formData = new FormData();
    const values = this.destinationForm.value;

    formData.append('name', values.name);
    formData.append('slug', this.generateSlug(values.slug));
    formData.append('country', values.country);
    formData.append('region', values.region || '');
    formData.append('city', values.city || '');
    formData.append('shortDescription', values.shortDescription || '');
    formData.append('fullDescription', values.fullDescription || '');
    formData.append('isFeatured', String(values.isFeatured));
    formData.append('isActive', String(values.isActive));

    if (this.mainImageFile) {
      formData.append('mainImage', this.mainImageFile);
    }

    if (this.galleryFiles.length) {
      this.galleryFiles.forEach(file => {
        formData.append('gallery', file);
      });
    }

    await this.pb.collection('destinations').create(formData);

    // ✅ ALERTA DE ÉXITO
    await Swal.fire({
      icon: 'success',
      title: 'Destino creado',
      text: 'El destino se ha guardado correctamente.',
      confirmButtonText: 'Continuar',
      confirmButtonColor: '#3085d6'
    });

    this.router.navigate(['/destinos']);

  } catch (error) {
    console.error('Error al crear destino:', error);

    // ❌ ALERTA DE ERROR
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ocurrió un problema al guardar el destino.',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#d33'
    });

  } finally {
    this.loading = false;
  }
}
}

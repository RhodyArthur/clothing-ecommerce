import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Supabase } from '../../../../core/services/supabase';
import { Product } from '../../../../core/services/product';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ChipModule } from 'primeng/chip';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-product-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    SelectModule,
    ButtonModule,
    ToastModule,
    ChipModule,
  ],
  providers: [MessageService],
  templateUrl: './product-form.html',
})
export class ProductForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supabase = inject(Supabase);
  private productService = inject(Product);
  private messages = inject(MessageService);

  isEdit = signal(false);
  productId = signal<string | null>(null);
  submitting = signal(false);
  uploading = signal(false);
  imageUrls = signal<string[]>([]);

  // Chip input helpers
  sizeInput: string | null = null;
  colorInput = '';

  sizeOptions = [
    { label: 'XS', value: 'XS' },
    { label: 'S', value: 'S' },
    { label: 'M', value: 'M' },
    { label: 'L', value: 'L' },
    { label: 'XL', value: 'XL' },
    { label: 'XXL', value: 'XXL' },
    { label: '3XL', value: '3XL' },
    { label: '4XL', value: '4XL' },
    { label: 'One Size', value: 'ONE SIZE' },
  ];

  categories = [
    { label: 'Women', value: 'women' },
    { label: 'Men', value: 'men' },
    { label: 'Accessories', value: 'accessories' },
  ];

  form = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0.01)]],
    category: ['', Validators.required],
    stock_count: [0, [Validators.required, Validators.min(0)]],
    sizes: [[] as string[]],
    colors: [[] as string[]],
  });

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.productId.set(id);
      await this.loadProduct(id);
    }
  }

  private async loadProduct(id: string): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return;

    this.form.patchValue({
      name: data['name'],
      description: data['description'],
      price: data['price'],
      category: data['category'],
      stock_count: data['stock_count'],
      sizes: data['sizes'] ?? [],
      colors: data['colors'] ?? [],
    });
    this.imageUrls.set(data['image_urls'] ?? []);
  }

  // ── Image upload ───────────────────────────────────

  async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;

    this.uploading.set(true);

    for (const file of files) {
      try {
        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const path = `products/${fileName}`;

        const { error: uploadError } = await this.supabase.client.storage
          .from('product-images')
          .upload(path, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = this.supabase.client.storage.from('product-images').getPublicUrl(path);

        this.imageUrls.update((urls) => [...urls, data.publicUrl]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        this.messages.add({
          severity: 'error',
          summary: 'Upload failed',
          detail: message,
          life: 4000,
        });
      }
    }

    this.uploading.set(false);
    input.value = '';
  }

  removeImage(url: string): void {
    this.imageUrls.update((urls) => urls.filter((u) => u !== url));
  }

  // ── Size / Color chip management ───────────────────

  addSize(): void {
    const val = this.sizeInput;
    if (!val) return;
    const validValues = this.sizeOptions.map((s) => s.value);
    if (!validValues.includes(val)) return;
    const current = this.form.value.sizes ?? [];
    if (!current.includes(val)) {
      this.form.patchValue({ sizes: [...current, val] });
    }
    this.sizeInput = null;
  }

  removeSize(size: string): void {
    this.form.patchValue({
      sizes: (this.form.value.sizes ?? []).filter((s) => s !== size),
    });
  }

  addColor(): void {
    const val = this.colorInput.trim();
    const capitalized = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
    if (!capitalized) return;
    const current = this.form.value.colors ?? [];
    if (!current.includes(capitalized)) {
      this.form.patchValue({ colors: [...current, capitalized] });
    }
    this.colorInput = '';
  }

  removeColor(color: string): void {
    this.form.patchValue({
      colors: (this.form.value.colors ?? []).filter((c) => c !== color),
    });
  }

  // ── Submit ─────────────────────────────────────────

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formSnapshot = this.form.getRawValue();
    const imageUrlsSnapshot = [...this.imageUrls()];
    const sizeInputSnapshot = this.sizeInput;
    const colorInputSnapshot = this.colorInput;

    this.submitting.set(true);

    const payload = {
      ...this.form.value,
      image_urls: this.imageUrls(),
    };

    try {
      if (this.isEdit()) {
        const { error } = await this.supabase.client
          .from('products')
          .update(payload)
          .eq('id', this.productId()!);
        if (error) throw error;
        this.messages.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Product updated successfully',
          life: 3000,
        });
      } else {
        const { error } = await this.supabase.client
          .from('products')
          .insert({ ...payload, is_active: true });
        if (error) throw error;
        this.messages.add({
          severity: 'success',
          summary: 'Created',
          detail: 'Product added successfully',
          life: 3000,
        });
      }

      await this.productService.fetchProducts();
      setTimeout(() => this.router.navigate(['/admin/products']), 1000);
    } catch (err: unknown) {
      this.form.patchValue(formSnapshot);
      this.imageUrls.set(imageUrlsSnapshot);
      this.sizeInput = sizeInputSnapshot;
      this.colorInput = colorInputSnapshot;

      const message = err instanceof Error ? err.message : 'An error occurred';
      this.messages.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 4000,
      });
    } finally {
      this.submitting.set(false);
    }
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }
}
